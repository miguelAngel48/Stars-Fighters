package com.StarsFighters.StarsFighters.Repositories;

import com.StarsFighters.StarsFighters.Models.Enums.FriendshipStatus;
import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendshipRepo extends JpaRepository<Friendship,Long> {

    List<Friendship> findByUserAndStatus(User currentUser, FriendshipStatus friendshipStatus);

    List<Friendship> findByFriendAndStatus(User currentUser, FriendshipStatus friendshipStatus);

    @Query("SELECT f FROM Friendship f WHERE (f.user = :user OR f.friend = :user) AND f.status = :status")
    List<Friendship> findAcceptedFriendships(@Param("user") User user, @Param("status") FriendshipStatus status);

}
