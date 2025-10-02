package app.di;

import app.repo.UserItemRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("javax.inject.Named")
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class RepoModule_UserRepoFactory implements Factory<UserItemRepository> {
  private final Provider<DynamoDbEnhancedClient> enhancedProvider;

  private final Provider<String> tableNameProvider;

  public RepoModule_UserRepoFactory(Provider<DynamoDbEnhancedClient> enhancedProvider,
      Provider<String> tableNameProvider) {
    this.enhancedProvider = enhancedProvider;
    this.tableNameProvider = tableNameProvider;
  }

  @Override
  public UserItemRepository get() {
    return userRepo(enhancedProvider.get(), tableNameProvider.get());
  }

  public static RepoModule_UserRepoFactory create(Provider<DynamoDbEnhancedClient> enhancedProvider,
      Provider<String> tableNameProvider) {
    return new RepoModule_UserRepoFactory(enhancedProvider, tableNameProvider);
  }

  public static UserItemRepository userRepo(DynamoDbEnhancedClient enhanced, String tableName) {
    return Preconditions.checkNotNullFromProvides(RepoModule.userRepo(enhanced, tableName));
  }
}
