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

    /**
     * Self-ping every 10 minutes (600,000 ms) to keep the Render free tier container active.
     * Making an outbound HTTP request to the public URL routes through Render's external load balancer,
     * resetting the 15-minute inactivity spin-down timer.
     */
    @Scheduled(fixedRate = 600000, initialDelay = 120000)
    public void pingSelf() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(healthUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", "Aura-KeepAlive-Ping/1.0")
                    .GET()
                    .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding())
                    .thenAccept(res -> log.debug("Server self-keepalive ping succeeded with status: {}", res.statusCode()))
                    .exceptionally(ex -> {
                        log.debug("Server self-keepalive ping completed/handled: {}", ex.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            log.debug("KeepAlive ping scheduling note: {}", e.getMessage());
        }
    }
}
