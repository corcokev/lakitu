package app.service;

import app.model.UserItem;
import app.repo.UserItemRepository;

import javax.inject.Inject;
import java.util.*;

public class ItemService {
  private final UserItemRepository repo;

  @Inject
  public ItemService(UserItemRepository repo) { this.repo = repo; }

  public UserItem create(String userId, String value) {
    String id = UUID.randomUUID().toString();
    long now = System.currentTimeMillis();
    return repo.put(userId, id, value, now);
  }

  public Optional<UserItem> get(String userId, String id) { return repo.get(userId, id); }
  public List<UserItem> list(String userId) { return repo.list(userId); }
  public void delete(String userId, String id) { repo.delete(userId, id); }
}