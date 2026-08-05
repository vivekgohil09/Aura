package com.chitchat.backend.config;

import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PreDestroy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.ServerSocket;

@Configuration
public class SocketIOServerConfig {

    private SocketIOServer server;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(9092);
        config.setOrigin("*");

        server = new SocketIOServer(config);

        server.addEventListener("setup", Object.class, (client, data, ackSender) -> {
            if (data != null) {
                client.joinRoom("user_" + data.toString());
            }
        });

        server.addEventListener("join chat", Object.class, (client, room, ackSender) -> {
            if (room != null) {
                client.joinRoom(room.toString());
            }
        });

        server.addEventListener("typing", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("typing", data);
        });

        server.addEventListener("stop typing", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("stop typing", data);
        });

        server.addEventListener("call-user", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("call-user", data);
        });

        server.addEventListener("accept-call", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("accept-call", data);
        });

        server.addEventListener("end-call", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("end-call", data);
        });

        server.addEventListener("new message", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("message received", data);
        });

        if (isPortAvailable(9092)) {
            try {
                server.start();
                System.out.println("🚀 Native Netty Socket.IO Server successfully started on port 9092");
            } catch (Exception e) {
                System.err.println("⚠️ Could not start Netty Socket.IO server: " + e.getMessage());
            }
        } else {
            System.out.println("ℹ️ Netty Socket.IO Server port 9092 is already active.");
        }

        return server;
    }

    private boolean isPortAvailable(int port) {
        try (ServerSocket ss = new ServerSocket(port)) {
            ss.setReuseAddress(true);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @PreDestroy
    public void stopSocketIOServer() {
        if (server != null) {
            try {
                server.stop();
            } catch (Exception ignored) {}
        }
    }
}
