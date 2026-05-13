package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.FriendDto;
import com.StarsFighters.StarsFighters.Models.Dto.FriendRequestDto;
import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import com.StarsFighters.StarsFighters.Models.Entities.Enums.FriendshipStatus;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.FriendshipRepo;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FriendshipService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private FriendshipRepo friendshipRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // --- EL NUEVO MÉTODO PARA AÑADIR POR CÓDIGO ---
    @Transactional
    public void sendFriendRequestByCode(String senderUsername, String receiverFriendCode) {
        // 1. Buscar a los usuarios en la base de datos
        User sender = userRepo.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Usuario remitente no encontrado"));

        User receiver = userRepo.findByFriendCode(receiverFriendCode)
                .orElseThrow(() -> new RuntimeException("Jugador no encontrado con el código: " + receiverFriendCode));

        // 2. Validar que no se intente añadir a sí mismo
        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("No puedes enviarte una solicitud de amistad a ti mismo.");
        }

        // TODO (Opcional): Aquí podrías validar si ya existe una solicitud previa entre ellos
        // para no duplicarlas en la base de datos.

        // 3. Se almacena la petición en la base de datos
        Friendship request = new Friendship(sender, receiver, FriendshipStatus.PENDING);
        friendshipRepo.save(request);

        // 4. Se crea la alerta de petición de amistad
        Map<String, Object> alert = new HashMap<>();
        alert.put("type", "NEW_REQUEST");
        alert.put("friendshipId", request.getId());
        alert.put("senderName", sender.getUsername());

        // 5. Se envía por WebSockets
        messagingTemplate.convertAndSendToUser(
                receiver.getUsername(),
                "/queue/notifications",
                alert
        );
    }

    // --- MANTENEMOS TUS MÉTODOS ANTERIORES POR SI LOS NECESITAS ---

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



    public List<FriendDto> getAcceptedFriends(String username) {
        User currentUser = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Usamos la nueva Query que busca en ambas direcciones
        List<Friendship> friendships = friendshipRepo.findAcceptedFriendships(currentUser, FriendshipStatus.ACCEPTED);

        return friendships.stream()
                .map(friendship -> {

                    User theOtherPlayer;
                    if (friendship.getUser().getId().equals(currentUser.getId())) {
                        theOtherPlayer = friendship.getFriend();
                    } else {
                        theOtherPlayer = friendship.getUser();
                    }

                    return new FriendDto(
                            theOtherPlayer.getId(),
                            theOtherPlayer.getUsername(),
                            theOtherPlayer.getFriendCode()
                    );
                })
                .collect(Collectors.toList());
    }

    public List<FriendRequestDto> getPendingRequests(String username) {
        User currentUser = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Buscamos en la BD las amistades donde el "friend" (recibidor) soy yo y están PENDING
        List<Friendship> pending = friendshipRepo.findByFriendAndStatus(currentUser, FriendshipStatus.PENDING);

        return pending.stream()
                .map(f -> new FriendRequestDto(
                        f.getId(),
                        f.getUser().getUsername() // El nombre del que envió la solicitud
                ))
                .collect(Collectors.toList());
    }
}