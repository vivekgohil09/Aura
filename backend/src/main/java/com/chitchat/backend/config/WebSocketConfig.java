package com.chitchat.backend.config;

import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.UserRepository;
import com.chitchat.backend.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (!StringUtils.hasText(authHeader)) {
                        authHeader = accessor.getFirstNativeHeader("passcode");
                    }
                    if (!StringUtils.hasText(authHeader)) {
                        List<String> nativeAuth = accessor.getNativeHeader("Authorization");
                        if (nativeAuth != null && !nativeAuth.isEmpty()) {
                            authHeader = nativeAuth.get(0);
                        }
                    }

                    if (StringUtils.hasText(authHeader)) {
                        String jwt = authHeader;
                        if (jwt.startsWith("Bearer ")) {
                            jwt = jwt.substring(7).trim();
                        }
                        if (jwt.startsWith("\"") && jwt.endsWith("\"") && jwt.length() > 1) {
                            jwt = jwt.substring(1, jwt.length() - 1);
                        }

                        if (tokenProvider.validateToken(jwt)) {
                            String userId = tokenProvider.getUserIdFromJwt(jwt);
                            User user = userRepository.findById(userId).orElse(null);
                            if (user != null) {
                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        user, null, Collections.emptyList());
                                accessor.setUser(auth);
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}
