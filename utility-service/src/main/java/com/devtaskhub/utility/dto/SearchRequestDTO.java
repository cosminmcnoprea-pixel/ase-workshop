package com.devtaskhub.utility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchRequestDTO {
    private String query;
    private String priority;
    private String status;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private Integer limit;
    private String sortBy;
    private String sortOrder;
}
