package contracts

type OpenAPIOperationPreview struct {
	Method          string `json:"method"`
	Path            string `json:"path"`
	ResponseStatus  int    `json:"response_status"`
	ResponseBody    string `json:"response_body"`
	ResponseHeaders string `json:"response_headers"`
	Status          string `json:"status"`
	Reason          string `json:"reason,omitempty"`
}

type OpenAPIImportPreview struct {
	TotalOperations int                       `json:"total_operations"`
	NewCount        int                       `json:"new_count"`
	ExistingCount   int                       `json:"existing_count"`
	SkippedCount    int                       `json:"skipped_count"`
	Operations      []OpenAPIOperationPreview `json:"operations"`
}

type BulkCreateEndpointsRequest struct {
	Endpoints []CreateEndpointRequest `json:"endpoints" binding:"required,dive"`
}

type BulkCreateEndpointsResult struct {
	Created []*Endpoint                 `json:"created"`
	Skipped []BulkCreateSkippedEndpoint `json:"skipped"`
}

type BulkCreateSkippedEndpoint struct {
	Method string `json:"method"`
	Path   string `json:"path"`
	Reason string `json:"reason"`
}
