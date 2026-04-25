package com.StarsFighters.StarsFighters.Repositories;

import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendshipRepo extends JpaRepository<Friendship,Long> {

}
