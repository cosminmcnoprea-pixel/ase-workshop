package com.devtaskhub.utility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequestDTO {
    private String to;
    private String subject;
    private String body;
    private String templateName;
    private Map<String, Object> templateVariables;
}
