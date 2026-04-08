package com.devtaskhub.utility.service;

import com.devtaskhub.utility.dto.SearchRequestDTO;
import com.devtaskhub.utility.dto.SearchResultDTO;
import com.devtaskhub.utility.dto.TaskSearchResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final JdbcTemplate jdbcTemplate;
    private final List<String> recentSearches = new ArrayList<>();

    public SearchResultDTO searchTasks(SearchRequestDTO searchRequest) {
        try {
            String sql = buildSearchQuery(searchRequest);
            
            List<Object> params = new ArrayList<>();
            if (searchRequest.getQuery() != null && !searchRequest.getQuery().trim().isEmpty()) {
                params.add("%" + searchRequest.getQuery().toLowerCase() + "%");
            }
            if (searchRequest.getPriority() != null) {
                params.add(searchRequest.getPriority());
            }
            if (searchRequest.getStatus() != null) {
                params.add(searchRequest.getStatus());
            }
            if (searchRequest.getFromDate() != null) {
                params.add(searchRequest.getFromDate());
            }
            if (searchRequest.getToDate() != null) {
                params.add(searchRequest.getToDate());
            }

            List<TaskSearchResultDTO> results = jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) -> 
                TaskSearchResultDTO.builder()
                    .id(rs.getString("id"))
                    .title(rs.getString("title"))
                    .description(rs.getString("description"))
                    .priority(rs.getString("priority"))
                    .status(rs.getString("status"))
                    .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                    .relevanceScore(calculateRelevanceScore(rs.getString("title"), rs.getString("description"), searchRequest.getQuery()))
                    .build());

            // Store recent search
            if (searchRequest.getQuery() != null && !searchRequest.getQuery().trim().isEmpty()) {
                addToRecentSearches(searchRequest.getQuery());
            }

            return SearchResultDTO.builder()
                    .results(results)
                    .totalCount(results.size())
                    .query(searchRequest.getQuery())
                    .searchTime(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error searching tasks", e);
            return SearchResultDTO.builder()
                    .results(new ArrayList<>())
                    .totalCount(0)
                    .query(searchRequest.getQuery())
                    .searchTime(LocalDateTime.now())
                    .build();
        }
    }

    public SearchResultDTO getSearchSuggestions(String query) {
        try {
            String sql = """
                SELECT DISTINCT title, id
                FROM tasks 
                WHERE title ILIKE ? 
                LIMIT 5
                """;
            
            List<Map<String, Object>> suggestions = jdbcTemplate.queryForList(sql, "%" + query + "%");
            
            List<TaskSearchResultDTO> results = suggestions.stream()
                    .map(suggestion -> TaskSearchResultDTO.builder()
                            .id((String) suggestion.get("id"))
                            .title((String) suggestion.get("title"))
                            .description("")
                            .priority("")
                            .status("")
                            .createdAt(null)
                            .relevanceScore(1.0)
                            .build())
                    .toList();

            return SearchResultDTO.builder()
                    .results(results)
                    .totalCount(results.size())
                    .query(query)
                    .searchTime(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error getting search suggestions", e);
            return SearchResultDTO.builder()
                    .results(new ArrayList<>())
                    .totalCount(0)
                    .query(query)
                    .searchTime(LocalDateTime.now())
                    .build();
        }
    }

    public SearchResultDTO getRecentSearches() {
        List<TaskSearchResultDTO> recentResults = recentSearches.stream()
                .limit(10)
                .map(query -> TaskSearchResultDTO.builder()
                        .id("")
                        .title(query)
                        .description("Recent search")
                        .priority("")
                        .status("")
                        .createdAt(null)
                        .relevanceScore(1.0)
                        .build())
                .toList();

        return SearchResultDTO.builder()
                .results(recentResults)
                .totalCount(recentResults.size())
                .query("recent")
                .searchTime(LocalDateTime.now())
                .build();
    }

    private String buildSearchQuery(SearchRequestDTO searchRequest) {
        StringBuilder sql = new StringBuilder("SELECT id, title, description, priority, status, created_at FROM tasks WHERE 1=1");
        
        if (searchRequest.getQuery() != null && !searchRequest.getQuery().trim().isEmpty()) {
            sql.append(" AND (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))");
        }
        
        if (searchRequest.getPriority() != null && !searchRequest.getPriority().isEmpty()) {
            sql.append(" AND priority = ?");
        }
        
        if (searchRequest.getStatus() != null && !searchRequest.getStatus().isEmpty()) {
            sql.append(" AND status = ?");
        }
        
        if (searchRequest.getFromDate() != null) {
            sql.append(" AND created_at >= ?");
        }
        
        if (searchRequest.getToDate() != null) {
            sql.append(" AND created_at <= ?");
        }
        
        sql.append(" ORDER BY created_at DESC");
        
        if (searchRequest.getLimit() != null && searchRequest.getLimit() > 0) {
            sql.append(" LIMIT ").append(searchRequest.getLimit());
        }
        
        return sql.toString();
    }

    private double calculateRelevanceScore(String title, String description, String query) {
        if (query == null || query.trim().isEmpty()) {
            return 1.0;
        }
        
        String lowerQuery = query.toLowerCase();
        String lowerTitle = title.toLowerCase();
        String lowerDescription = description.toLowerCase();
        
        double score = 0.0;
        
        // Title match (higher weight)
        if (lowerTitle.contains(lowerQuery)) {
            score += 2.0;
            if (lowerTitle.startsWith(lowerQuery)) {
                score += 1.0;
            }
        }
        
        // Description match (lower weight)
        if (lowerDescription.contains(lowerQuery)) {
            score += 1.0;
        }
        
        return Math.min(score, 3.0); // Cap at 3.0
    }

    private void addToRecentSearches(String query) {
        recentSearches.removeIf(q -> q.equals(query));
        recentSearches.add(0, query);
        
        // Keep only last 20 searches
        if (recentSearches.size() > 20) {
            recentSearches.subList(20, recentSearches.size()).clear();
        }
    }
}
