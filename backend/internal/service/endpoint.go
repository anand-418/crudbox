package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/getkin/kin-openapi/openapi3"

	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/models"
	"github.com/crudboxin/crudbox/internal/repository"
)

type endpointService struct {
	repo        repository.EndpointRepository
	projectRepo repository.ProjectRepository
	userRepo    repository.UserRepository
}

var ErrInvalidOpenAPIDocument = errors.New("invalid openapi document")

func NewEndpointService(repo repository.EndpointRepository, projectRepo repository.ProjectRepository, userRepo repository.UserRepository) EndpointService {
	return &endpointService{
		repo:        repo,
		projectRepo: projectRepo,
		userRepo:    userRepo,
	}
}

func (s *endpointService) CreateEndpoint(req *contracts.CreateEndpointRequest, projectUUID string, userID int) (*contracts.Endpoint, error) {
	project, err := s.projectRepo.GetByUUIDForUser(projectUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	return s.createEndpointRecord(project, user, req)
}

func (s *endpointService) createEndpointRecord(project *models.Project, user *models.User, req *contracts.CreateEndpointRequest) (*contracts.Endpoint, error) {
	existingEndpoint, err := s.repo.GetByProjectIDAndPath(project.ID, req.Path, req.Method)
	if err == nil && existingEndpoint != nil {
		return nil, errors.New("endpoint with same method and path already exists")
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	now := time.Now()
	endpoint := &models.Endpoint{
		Method:          req.Method,
		Path:            req.Path,
		ResponseBody:    req.ResponseBody,
		ResponseStatus:  req.ResponseStatus,
		ResponseHeaders: req.ResponseHeaders,
		ProjectID:       project.ID,
		Base: models.Base{
			CreatedAt: &now,
			UpdatedAt: &now,
			CreatedBy: sql.NullString{String: user.UUID, Valid: true},
			UpdatedBy: sql.NullString{String: user.UUID, Valid: true},
		},
	}

	if err := s.repo.Create(endpoint); err != nil {
		return nil, err
	}

	return &contracts.Endpoint{
		ID:              endpoint.ID,
		UUID:            endpoint.UUID,
		Method:          endpoint.Method,
		Path:            endpoint.Path,
		ResponseBody:    endpoint.ResponseBody,
		ResponseStatus:  endpoint.ResponseStatus,
		ResponseHeaders: endpoint.ResponseHeaders,
		ProjectUUID:     project.UUID,
		CreatedAt:       endpoint.CreatedAt,
		UpdatedAt:       endpoint.UpdatedAt,
		CreatedBy:       user.UUID,
		UpdatedBy:       user.UUID,
	}, nil
}

func (s *endpointService) GetByProjectIDAndPath(projectID int, path, method string) (*contracts.Endpoint, error) {
	endpoint, err := s.repo.GetByProjectIDAndPath(projectID, path, method)
	if err != nil {
		return nil, err
	}
	project, err := s.projectRepo.GetByID(projectID)
	if err != nil {
		return nil, err
	}
	return &contracts.Endpoint{
		ID:              endpoint.ID,
		UUID:            endpoint.UUID,
		Method:          endpoint.Method,
		Path:            endpoint.Path,
		ResponseBody:    endpoint.ResponseBody,
		ResponseStatus:  endpoint.ResponseStatus,
		ResponseHeaders: endpoint.ResponseHeaders,
		ProjectUUID:     project.UUID,
		CreatedBy:       endpoint.CreatedBy.String,
		UpdatedBy:       endpoint.UpdatedBy.String,
	}, nil
}

func (s *endpointService) UpdateEndpoint(endpointUUID string, req *contracts.UpdateEndpointRequest, userID int) (*contracts.Endpoint, error) {
	endpoint, err := s.repo.GetByUUIDForUser(endpointUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("endpoint not found")
		}
		return nil, err
	}

	project, err := s.projectRepo.GetByID(endpoint.ProjectID)
	if err != nil {
		return nil, errors.New("project not found")
	}

	// Check for potential duplicate if method or path is being updated
	newMethod := endpoint.Method
	newPath := endpoint.Path

	if req.Method != nil {
		newMethod = *req.Method
	}
	if req.Path != nil {
		newPath = *req.Path
	}

	// Only check for duplicates if method or path is actually changing
	if (req.Method != nil && *req.Method != endpoint.Method) || (req.Path != nil && *req.Path != endpoint.Path) {
		existingEndpoint, err := s.repo.GetByProjectIDAndPath(endpoint.ProjectID, newPath, newMethod)
		if err == nil && existingEndpoint != nil && existingEndpoint.ID != endpoint.ID {
			return nil, errors.New("endpoint with same method and path already exists")
		}
	}

	if req.Method != nil {
		endpoint.Method = *req.Method
	}
	if req.Path != nil {
		endpoint.Path = *req.Path
	}
	if req.ResponseBody != nil {
		endpoint.ResponseBody = *req.ResponseBody
	}
	if req.ResponseStatus != nil {
		endpoint.ResponseStatus = *req.ResponseStatus
	}
	if req.ResponseHeaders != nil {
		endpoint.ResponseHeaders = *req.ResponseHeaders
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	endpoint.UpdatedBy = sql.NullString{String: user.UUID, Valid: true}
	endpoint.UpdatedAt = &now

	err = s.repo.Update(endpoint)
	if err != nil {
		return nil, err
	}

	return &contracts.Endpoint{
		ID:              endpoint.ID,
		UUID:            endpoint.UUID,
		Method:          endpoint.Method,
		Path:            endpoint.Path,
		ResponseBody:    endpoint.ResponseBody,
		ResponseStatus:  endpoint.ResponseStatus,
		ResponseHeaders: endpoint.ResponseHeaders,
		ProjectUUID:     project.UUID,
		CreatedAt:       endpoint.CreatedAt,
		UpdatedAt:       endpoint.UpdatedAt,
		CreatedBy:       endpoint.CreatedBy.String,
		UpdatedBy:       endpoint.UpdatedBy.String,
	}, nil
}

func (s *endpointService) DeleteEndpoint(endpointUUID string, userID int) error {
	endpoint, err := s.repo.GetByUUIDForUser(endpointUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("endpoint not found")
		}
		return err
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}
	currentTime := time.Now()
	endpoint.DeletedAt = &currentTime
	endpoint.DeletedBy = sql.NullString{String: user.UUID, Valid: true}

	err = s.repo.Update(endpoint)
	if err != nil {
		return err
	}

	return nil
}

func (s *endpointService) GetByProjectUUID(projectUUID string, userID int) ([]*contracts.Endpoint, error) {
	project, err := s.projectRepo.GetByUUIDForUser(projectUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	endpoints, err := s.repo.GetByProjectID(project.ID)
	if err != nil {
		return nil, err
	}

	var result []*contracts.Endpoint
	for _, endpoint := range endpoints {
		result = append(result, &contracts.Endpoint{
			ID:              endpoint.ID,
			UUID:            endpoint.UUID,
			Method:          endpoint.Method,
			Path:            endpoint.Path,
			ResponseBody:    endpoint.ResponseBody,
			ResponseStatus:  endpoint.ResponseStatus,
			ResponseHeaders: endpoint.ResponseHeaders,
			ProjectUUID:     project.UUID,
			CreatedAt:       endpoint.CreatedAt,
			UpdatedAt:       endpoint.UpdatedAt,
			CreatedBy:       endpoint.CreatedBy.String,
			UpdatedBy:       endpoint.UpdatedBy.String,
		})
	}

	return result, nil
}

func (s *endpointService) CreateEndpointsBulk(projectUUID string, requests []contracts.CreateEndpointRequest, userID int) (*contracts.BulkCreateEndpointsResult, error) {
	project, err := s.projectRepo.GetByUUIDForUser(projectUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	result := &contracts.BulkCreateEndpointsResult{}

	for _, req := range requests {
		payload := req
		endpoint, createErr := s.createEndpointRecord(project, user, &payload)
		if createErr != nil {
			result.Skipped = append(result.Skipped, contracts.BulkCreateSkippedEndpoint{
				Method: req.Method,
				Path:   req.Path,
				Reason: createErr.Error(),
			})
			continue
		}

		result.Created = append(result.Created, endpoint)
	}

	return result, nil
}

func (s *endpointService) PreviewOpenAPIYAML(projectUUID string, data []byte, userID int) (*contracts.OpenAPIImportPreview, error) {
	project, err := s.projectRepo.GetByUUIDForUser(projectUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	loader := openapi3.NewLoader()
	loader.IsExternalRefsAllowed = false
	doc, err := loader.LoadFromData(data)
	if err != nil {
		return nil, wrapOpenAPIError(err)
	}

	if err := doc.Validate(context.Background()); err != nil {
		return nil, wrapOpenAPIError(err)
	}

	operations := extractOperationsFromOpenAPIDoc(doc)
	preview := &contracts.OpenAPIImportPreview{
		TotalOperations: len(operations),
	}

	seen := make(map[string]struct{})
	for _, op := range operations {
		operationPreview := contracts.OpenAPIOperationPreview{
			Method:          op.Method,
			Path:            op.Path,
			ResponseStatus:  op.ResponseStatus,
			ResponseBody:    op.ResponseBody,
			ResponseHeaders: op.ResponseHeaders,
			Status:          "new",
		}

		key := op.Method + "::" + op.Path
		if _, exists := seen[key]; exists {
			operationPreview.Status = "duplicate"
			operationPreview.Reason = "Duplicate operation in uploaded document"
			preview.SkippedCount++
			preview.Operations = append(preview.Operations, operationPreview)
			continue
		}
		seen[key] = struct{}{}

		existingEndpoint, err := s.repo.GetByProjectIDAndPath(project.ID, op.Path, op.Method)
		if err == nil && existingEndpoint != nil {
			operationPreview.Status = "existing"
			operationPreview.Reason = "Endpoint already exists"
			preview.ExistingCount++
		} else if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				preview.NewCount++
			} else {
				return nil, err
			}
		} else {
			preview.NewCount++
		}

		preview.Operations = append(preview.Operations, operationPreview)
	}

	return preview, nil
}

type openAPIOperation struct {
	Method          string
	Path            string
	ResponseStatus  int
	ResponseBody    string
	ResponseHeaders string
}

func extractOperationsFromOpenAPIDoc(doc *openapi3.T) []openAPIOperation {
	if doc.Paths == nil {
		return nil
	}

	var ops []openAPIOperation
	pathsMap := doc.Paths.Map()
	paths := make([]string, 0, len(pathsMap))
	for path := range pathsMap {
		paths = append(paths, path)
	}
	sort.Strings(paths)

	for _, path := range paths {
		pathItem := pathsMap[path]
		if pathItem == nil {
			continue
		}

		operations := pathItem.Operations()
		methodKeys := make([]string, 0, len(operations))
		for method := range operations {
			methodKeys = append(methodKeys, method)
		}
		sort.Strings(methodKeys)

		for _, method := range methodKeys {
			operation := operations[method]
			if operation == nil {
				continue
			}

			ops = append(ops, buildOperation(path, strings.ToUpper(method), operation))
		}
	}

	return ops
}

func buildOperation(path, method string, operation *openapi3.Operation) openAPIOperation {
	status, body := extractResponse(operation)
	headers := extractHeaders(operation)
	return openAPIOperation{
		Method:          method,
		Path:            path,
		ResponseStatus:  status,
		ResponseBody:    body,
		ResponseHeaders: headers,
	}
}

func extractResponse(operation *openapi3.Operation) (int, string) {
	const defaultStatus = 200
	statusCode := defaultStatus
	responseBody := ""

	if operation == nil || operation.Responses == nil {
		return statusCode, responseBody
	}

	keys := make([]string, 0, len(operation.Responses.Map()))
	for code := range operation.Responses.Map() {
		keys = append(keys, code)
	}
	sort.Strings(keys)

	for _, code := range keys {
		if code == "default" {
			continue
		}
		respRef := operation.Responses.Map()[code]
		if respRef == nil || respRef.Value == nil {
			continue
		}

		if parsed, err := strconv.Atoi(code); err == nil {
			statusCode = parsed
		}

		if body := extractResponseBody(respRef.Value); body != "" {
			responseBody = body
			break
		}
	}

	return statusCode, responseBody
}

func extractHeaders(operation *openapi3.Operation) string {
	if operation == nil || operation.Responses == nil {
		return ""
	}

	primaryResponse := selectPrimaryResponse(operation)
	if primaryResponse == nil || primaryResponse.Headers == nil {
		return ""
	}

	headers := make(map[string]string)
	for name, headerRef := range primaryResponse.Headers {
		if headerRef == nil || headerRef.Value == nil {
			continue
		}
		value := ""
		switch v := headerRef.Value.Example.(type) {
		case string:
			value = v
		case nil:
			// noop
		default:
			if data, err := json.Marshal(v); err == nil {
				value = string(data)
			}
		}
		if value == "" && headerRef.Value.Schema != nil && headerRef.Value.Schema.Value != nil {
			if def := headerRef.Value.Schema.Value.Default; def != nil {
				if data, err := json.Marshal(def); err == nil {
					value = string(data)
				}
			}
		}
		if value != "" {
			headers[name] = value
		}
	}

	if len(headers) == 0 {
		return ""
	}

	encoded, err := json.Marshal(headers)
	if err != nil {
		return ""
	}

	return string(encoded)
}

func selectPrimaryResponse(operation *openapi3.Operation) *openapi3.Response {
	if operation == nil || operation.Responses == nil {
		return nil
	}

	keys := make([]string, 0, len(operation.Responses.Map()))
	for code := range operation.Responses.Map() {
		keys = append(keys, code)
	}
	sort.Strings(keys)

	for _, code := range keys {
		if code == "default" {
			continue
		}
		respRef := operation.Responses.Map()[code]
		if respRef != nil && respRef.Value != nil {
			return respRef.Value
		}
	}

	return nil
}

func extractResponseBody(response *openapi3.Response) string {
	if response == nil || response.Content == nil {
		return ""
	}

	keys := make([]string, 0, len(response.Content))
	for contentType := range response.Content {
		keys = append(keys, contentType)
	}
	sort.Strings(keys)

	for _, contentType := range keys {
		media := response.Content[contentType]
		if media == nil {
			continue
		}
		if media.Example != nil {
			if data, err := json.Marshal(media.Example); err == nil {
				return string(data)
			}
		}
		for _, exampleRef := range media.Examples {
			if exampleRef == nil || exampleRef.Value == nil {
				continue
			}
			if data, err := json.Marshal(exampleRef.Value.Value); err == nil {
				return string(data)
			}
		}
		if media.Schema != nil && media.Schema.Value != nil {
			if example := buildExampleFromSchema(media.Schema.Value); example != nil {
				if data, err := json.Marshal(example); err == nil {
					return string(data)
				}
			}
		}
	}

	return ""
}

func buildExampleFromSchema(schema *openapi3.Schema) interface{} {
	if schema == nil {
		return nil
	}

	if schema.Example != nil {
		return schema.Example
	}

	if schema.Default != nil {
		return schema.Default
	}

	switch schema.Type {
	case openapi3.TypeObject:
		result := make(map[string]interface{})
		for name, prop := range schema.Properties {
			if prop == nil {
				continue
			}
			result[name] = buildExampleFromSchema(prop.Value)
		}
		return result
	case openapi3.TypeArray:
		if schema.Items != nil && schema.Items.Value != nil {
			item := buildExampleFromSchema(schema.Items.Value)
			if item != nil {
				return []interface{}{item}
			}
		}
		return []interface{}{}
	case openapi3.TypeInteger, openapi3.TypeNumber:
		return 0
	case openapi3.TypeBoolean:
		return false
	case openapi3.TypeString:
		if len(schema.Enum) > 0 {
			return schema.Enum[0]
		}
		return ""
	default:
		return nil
	}
}

func wrapOpenAPIError(err error) error {
	return fmt.Errorf("%w: %v", ErrInvalidOpenAPIDocument, err)
}

func (s *endpointService) GetEndpoint(endpointUUID string, userID int) (*contracts.Endpoint, error) {
	endpoint, err := s.repo.GetByUUIDForUser(endpointUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("endpoint not found")
		}
		return nil, err
	}

	return &contracts.Endpoint{
		ID:              endpoint.ID,
		UUID:            endpoint.UUID,
		Method:          endpoint.Method,
		Path:            endpoint.Path,
		ResponseBody:    endpoint.ResponseBody,
		ResponseStatus:  endpoint.ResponseStatus,
		ResponseHeaders: endpoint.ResponseHeaders,
		CreatedAt:       endpoint.CreatedAt,
		UpdatedAt:       endpoint.UpdatedAt,
		CreatedBy:       endpoint.CreatedBy.String,
		UpdatedBy:       endpoint.UpdatedBy.String,
	}, nil
}
