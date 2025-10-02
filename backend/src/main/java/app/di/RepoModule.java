package app.di;

import app.repo.UserItemRepository;
import dagger.Module;
import dagger.Provides;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import javax.inject.Named;
import javax.inject.Singleton;

@Module
public class RepoModule {
  @Provides @Singleton
  static DynamoDbEnhancedClient enhanced(DynamoDbClient ddb) {
    return DynamoDbEnhancedClient.builder().dynamoDbClient(ddb).build();
  }

  @Provides @Singleton
  static UserItemRepository userRepo(DynamoDbEnhancedClient enhanced, @Named("TABLE_NAME") String tableName) {
    return new UserItemRepository(enhanced, tableName);
  }
}