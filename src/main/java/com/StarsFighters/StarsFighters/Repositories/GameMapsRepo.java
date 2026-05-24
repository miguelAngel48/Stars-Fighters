package com.StarsFighters.StarsFighters.Repositories;

import com.StarsFighters.StarsFighters.Models.Entities.GameMaps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameMapsRepo extends JpaRepository<GameMaps, Long> {}