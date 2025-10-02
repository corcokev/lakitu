package app.di;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
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
public final class RepoModule_EnhancedFactory implements Factory<DynamoDbEnhancedClient> {
  private final Provider<DynamoDbClient> ddbProvider;

  public RepoModule_EnhancedFactory(Provider<DynamoDbClient> ddbProvider) {
    this.ddbProvider = ddbProvider;
  }

  @Override
  public DynamoDbEnhancedClient get() {
    return enhanced(ddbProvider.get());
  }

  public static RepoModule_EnhancedFactory create(Provider<DynamoDbClient> ddbProvider) {
    return new RepoModule_EnhancedFactory(ddbProvider);
  }

  public static DynamoDbEnhancedClient enhanced(DynamoDbClient ddb) {
    return Preconditions.checkNotNullFromProvides(RepoModule.enhanced(ddb));
  }
}
