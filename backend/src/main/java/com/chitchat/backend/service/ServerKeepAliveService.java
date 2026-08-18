package com.chitchat.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class ServerKeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(ServerKeepAliveService.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.render.backend-url:https://aura-vdcq.onrender.com/api/health}")
    private String healthUrl;

    @Value("${app.render.frontend-url:}")
    private String frontendUrl;

    /**
     * Self-ping every 4 minutes (240,000 ms) to keep both the Backend and Frontend active on Render.
     * Making an outbound HTTP request to the public URLs routes through Render's external load balancer,
     * resetting the 15-minute inactivity spin-down timer.
     */
    @Scheduled(fixedRate = 240000, initialDelay = 30000)
    public void pingSelf() {
        // 1. Ping Backend Health
        pingUrl(healthUrl, "Backend");

        // 2. Ping Frontend URL if configured
        if (frontendUrl != null && !frontendUrl.trim().isEmpty()) {
            pingUrl(frontendUrl.trim(), "Frontend");
        }
    }

    private void pingUrl(String targetUrl, String serviceName) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", "Aura-KeepAlive-Ping/1.0")
                    .GET()
                    .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding())
                    .thenAccept(res -> log.debug("{} keepalive ping succeeded with status: {}", serviceName, res.statusCode()))
                    .exceptionally(ex -> {
                        log.debug("{} keepalive ping handled: {}", serviceName, ex.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            log.debug("{} keepalive ping error note: {}", serviceName, e.getMessage());
        }
    }
}
