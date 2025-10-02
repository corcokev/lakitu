package app.repo;

import app.model.UserItem;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.*;

@DynamoDbBean
class UserItemRecord {
  private String userId;
  private String itemId;
  private String value;
  private Long createdAt;
  private Long updatedAt;

  @DynamoDbPartitionKey
  public String getUserId() {
    return userId;
  }

  public void setUserId(String v) {
    userId = v;
  }

  @DynamoDbSortKey
  public String getItemId() {
    return itemId;
  }

  public void setItemId(String v) {
    itemId = v;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String v) {
    value = v;
  }

  public Long getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Long v) {
    createdAt = v;
  }

  public Long getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Long v) {
    updatedAt = v;
  }
}

public class UserItemRepository {
  private final DynamoDbEnhancedClient enhanced;
  private final DynamoDbTable<UserItemRecord> table;

  public UserItemRepository(DynamoDbEnhancedClient enhanced, String tableName) {
    this.enhanced = enhanced;
    this.table = enhanced.table(tableName, TableSchema.fromBean(UserItemRecord.class));
  }

  public UserItem put(String userId, String itemId, String value, long now) {
    UserItemRecord r = new UserItemRecord();
    r.setUserId(userId);
    r.setItemId(itemId);
    r.setValue(value);
    r.setCreatedAt(now);
    r.setUpdatedAt(now);
    table.putItem(r);
    return toModel(r);
  }

  public Optional<UserItem> get(String userId, String itemId) {
    Key key = Key.builder().partitionValue(userId).sortValue(itemId).build();
    UserItemRecord r = table.getItem(key);
    return Optional.ofNullable(r).map(this::toModel);
  }

  public List<UserItem> list(String userId) {
    List<UserItem> out = new ArrayList<>();
    for (UserItemRecord r : table.query(r -> r.queryConditional(
        QueryConditional.keyEqualTo(Key.builder().partitionValue(userId).build()))).items()) {
      out.add(toModel(r));
    }
    return out;
  }

  public void delete(String userId, String itemId) {
    Key key = Key.builder().partitionValue(userId).sortValue(itemId).build();
    table.deleteItem(key);
  }

  private UserItem toModel(UserItemRecord r) {
    UserItem m = new UserItem();
    m.userId = r.getUserId();
    m.itemId = r.getItemId();
    m.value = r.getValue();
    m.createdAt = r.getCreatedAt();
    m.updatedAt = r.getUpdatedAt();
    return m;
  }
}