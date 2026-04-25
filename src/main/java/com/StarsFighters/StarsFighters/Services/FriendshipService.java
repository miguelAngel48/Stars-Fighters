package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import com.StarsFighters.StarsFighters.Models.Entities.FriendshipStatus;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.FriendshipRepo;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class FriendshipService {
    @Autowired
    UserRepo userRepo;
    @Autowired
    FriendshipRepo friendshipRepo;

    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void sendFriendRequest(Long senderId, Long receiverId) {
        User sender = userRepo.findById(senderId).orElseThrow();
        User receiver = userRepo.findById(receiverId).orElseThrow();

        //se almacena la petición en la base de datos
        Friendship request = new Friendship(sender,receiver,FriendshipStatus.PENDING);
        friendshipRepo.save(request);

        // se Crea la alerta de petición de amistad
        Map<String, Object> alert = new HashMap<>();
        alert.put("type", "NEW_REQUEST");
        alert.put("friendshipId", request.getId());
        alert.put("senderName", sender.getUsername());


        messagingTemplate.convertAndSendToUser(
                receiver.getUsername(),
                "/queue/notifications",
                alert
        );
    }
    @Transactional
    public void respondToRequest(Long requestId, boolean isAccepted) {
        Friendship request = friendshipRepo.findById(requestId).orElseThrow();
        User originalSender = request.getUser(); // El que envió la solicitud original

        if (isAccepted) {
            // Actualizamos la base de datos el estado de la petición
            request.setStatus(FriendshipStatus.ACCEPTED);
            friendshipRepo.save(request);

            // Notificación de la petición
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "REQUEST_ACCEPTED");
            alert.put("friendName", request.getFriend().getUsername());

            messagingTemplate.convertAndSendToUser(
                    originalSender.getUsername(),
                    "/queue/notifications",
                    alert
            );
        } else {
            // se borra en BD en el caso de rechazar
            friendshipRepo.delete(request);
        }
    }
}
