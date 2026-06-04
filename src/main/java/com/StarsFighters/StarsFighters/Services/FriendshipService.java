package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.FriendDto;
import com.StarsFighters.StarsFighters.Models.Dto.FriendRequestDto;
import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import com.StarsFighters.StarsFighters.Models.Enums.FriendshipStatus;
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

    @Transactional
    public void sendFriendRequestByCode(String senderUsername, String receiverFriendCode) {
        User sender = userRepo.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Usuario remitente no encontrado"));

        User receiver = userRepo.findByFriendCode(receiverFriendCode)
                .orElseThrow(() -> new RuntimeException("Jugador no encontrado con el código: " + receiverFriendCode));

        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("No puedes enviarte una solicitud de amistad a ti mismo.");
        }

        Friendship request = new Friendship(sender, receiver, FriendshipStatus.PENDING);
        friendshipRepo.save(request);

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
    public void sendFriendRequest(Long senderId, Long receiverId) {
        User sender = userRepo.findById(senderId).orElseThrow();
        User receiver = userRepo.findById(receiverId).orElseThrow();

        Friendship request = new Friendship(sender,receiver,FriendshipStatus.PENDING);
        friendshipRepo.save(request);

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
        User originalSender = request.getUser();

        if (isAccepted) {
            request.setStatus(FriendshipStatus.ACCEPTED);
            friendshipRepo.save(request);

            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "REQUEST_ACCEPTED");
            alert.put("friendName", request.getFriend().getUsername());

            messagingTemplate.convertAndSendToUser(
                    originalSender.getUsername(),
                    "/queue/notifications",
                    alert
            );
        } else {
            friendshipRepo.delete(request);
        }
    }

    public List<FriendDto> getAcceptedFriends(String username) {
        User currentUser = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Friendship> friendships = friendshipRepo.findAcceptedFriendships(currentUser, FriendshipStatus.ACCEPTED);

        return friendships.stream()
                .map(friendship -> {
                    User theOtherPlayer;
                    if (friendship.getUser().getId().equals(currentUser.getId())) {
                        theOtherPlayer = friendship.getFriend();
                    } else {
                        theOtherPlayer = friendship.getUser();
                    }

                    String currentStatus = "OFFLINE";
                    if (theOtherPlayer.isOnline()) {
                        if ("ACTIVE".equals(theOtherPlayer.getStatusPreference())) {
                            currentStatus = "ONLINE";
                        } else if ("DND".equals(theOtherPlayer.getStatusPreference())) {
                            currentStatus = "DND";
                        } else if ("INVISIBLE".equals(theOtherPlayer.getStatusPreference())) {
                            currentStatus = "OFFLINE";
                        }
                    }

                    return new FriendDto(
                            theOtherPlayer.getId(),
                            theOtherPlayer.getUsername(),
                            theOtherPlayer.getFriendCode(),
                            friendship.getId(),
                            currentStatus,
                            theOtherPlayer.getEquippedAvatarUrl()
                    );
                })
                .collect(Collectors.toList());
    }

    public List<FriendRequestDto> getPendingRequests(String username) {
        User currentUser = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Friendship> pending = friendshipRepo.findByFriendAndStatus(currentUser, FriendshipStatus.PENDING);

        return pending.stream()
                .map(f -> new FriendRequestDto(
                        f.getId(),
                        f.getUser().getUsername()
                ))
                .collect(Collectors.toList());
    }
}