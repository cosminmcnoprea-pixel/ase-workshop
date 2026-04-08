package com.devtaskhub.utility.controller;

import com.devtaskhub.utility.service.SearchService;
import com.devtaskhub.utility.dto.SearchRequestDTO;
import com.devtaskhub.utility.dto.SearchResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SearchController {

    private final SearchService searchService;

    @PostMapping("/tasks")
    public ResponseEntity<SearchResultDTO> searchTasks(@RequestBody SearchRequestDTO searchRequest) {
        return ResponseEntity.ok(searchService.searchTasks(searchRequest));
    }

    @GetMapping("/tasks/suggestions")
    public ResponseEntity<SearchResultDTO> getSearchSuggestions(@RequestParam String query) {
        return ResponseEntity.ok(searchService.getSearchSuggestions(query));
    }

    @GetMapping("/tasks/recent")
    public ResponseEntity<SearchResultDTO> getRecentSearches() {
        return ResponseEntity.ok(searchService.getRecentSearches());
    }
}
