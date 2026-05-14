package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message) {
        // Enviar al destino: /user/{recipient}/queue/messages
        // Nota: "recipient" debe ser el mismo valor (ej. email) que extrajiste en el Principal del Interceptor
        messagingTemplate.convertAndSendToUser(
                message.getContent(),
                "/queue/messages",
                message
        );
    }
}