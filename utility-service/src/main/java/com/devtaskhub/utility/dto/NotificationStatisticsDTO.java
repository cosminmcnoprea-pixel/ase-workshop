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
public class NotificationStatisticsDTO {
    private int totalNotifications;
    private int unreadNotifications;
    private int readNotifications;
    private int infoNotifications;
    private int successNotifications;
    private int warningNotifications;
    private double readRate;
    private LocalDateTime generatedAt;
}
