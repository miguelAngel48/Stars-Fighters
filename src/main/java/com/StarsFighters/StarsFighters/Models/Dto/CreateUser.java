package com.StarsFighters.StarsFighters.Models.Dto;

public record CreateUser (
         String username,
         String email,
         String password,
         String checkPassword
){
}
