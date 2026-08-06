package com.chitchat.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChitChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChitChatApplication.class, args);
    }
}
