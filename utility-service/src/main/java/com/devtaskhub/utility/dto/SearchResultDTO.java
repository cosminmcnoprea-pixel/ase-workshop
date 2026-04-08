package com.devtaskhub.utility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultDTO {
    private List<TaskSearchResultDTO> results;
    private int totalCount;
    private String query;
    private LocalDateTime searchTime;
}
