package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.FriendDto;
import com.StarsFighters.StarsFighters.Models.Dto.FriendRequestDto;
import com.StarsFighters.StarsFighters.Models.Entities.ChatMessage;
import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import com.StarsFighters.StarsFighters.Models.Enums.FriendshipStatus;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.ChatMessageRepo;
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
    private ChatMessageRepo chatMessageRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void sendFriendRequestByCode(String senderUsername, String receiverFriendCode) {
        User sender = userRepo.findByUsername(senderUsername).orElseThrow(() -> new RuntimeException("Emisor no encontrado"));
        User receiver = userRepo.findByFriendCode(receiverFriendCode).orElseThrow(() -> new RuntimeException("Código de amigo no encontrado"));

        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("No puedes enviarte una solicitud a ti mismo");
        }

        if (friendshipRepo.existsByUsers(sender, receiver)) {
            throw new RuntimeException("Ya existe una amistad o solicitud pendiente con este usuario");
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
        User sender = userRepo.findById(senderId).orElseThrow(() -> new RuntimeException("Emisor no encontrado"));
        User receiver = userRepo.findById(receiverId).orElseThrow(() -> new RuntimeException("Receptor no encontrado"));

        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("No puedes enviarte una solicitud a ti mismo");
        }

        if (friendshipRepo.existsByUsers(sender, receiver)) {
            throw new RuntimeException("Ya existe una amistad o solicitud pendiente con este usuario");
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

    @Transactional
    public void removeFriendship(Long friendshipId, String username) {
        Friendship friendship = friendshipRepo.findById(friendshipId).orElseThrow();
        User currentUser = userRepo.findByUsername(username).orElseThrow();

        if (!friendship.getUser().getId().equals(currentUser.getId()) &&
                !friendship.getFriend().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Error al cancelar la amistad");
        }

        List<ChatMessage> messages = chatMessageRepo.findByFriendshipId(friendshipId);
        if (messages != null && !messages.isEmpty()) {
            chatMessageRepo.deleteAll(messages);
        }

        friendshipRepo.delete(friendship);
    }

    public List<FriendDto> getAcceptedFriends(String username) {
        User currentUser = userRepo.findByUsername(username).orElseThrow();
        List<Friendship> friendships = friendshipRepo.findAcceptedFriendships(currentUser, FriendshipStatus.ACCEPTED);

        return friendships.stream()
                .map(friendship -> {
                    User theOtherPlayer = friendship.getUser().getId().equals(currentUser.getId())
                            ? friendship.getFriend()
                            : friendship.getUser();

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
                            theOtherPlayer.getEquippedAvatarUrl(),
                            theOtherPlayer.getWins(),
                            theOtherPlayer.getLosses(),
                            theOtherPlayer.getLevel()
                    );
                })
                .collect(Collectors.toList());
    }

    public List<FriendRequestDto> getPendingRequests(String username) {
        User currentUser = userRepo.findByUsername(username).orElseThrow();
        List<Friendship> pending = friendshipRepo.findByFriendAndStatus(currentUser, FriendshipStatus.PENDING);

        return pending.stream()
                .map(f -> new FriendRequestDto(
                        f.getId(),
                        f.getUser().getUsername()
                ))
                .collect(Collectors.toList());
    }
}