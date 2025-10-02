package app.di;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import software.amazon.awssdk.regions.Region;
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
public final class AwsModule_ProvideDdbFactory implements Factory<DynamoDbClient> {
  private final Provider<Region> regionProvider;

  public AwsModule_ProvideDdbFactory(Provider<Region> regionProvider) {
    this.regionProvider = regionProvider;
  }

  @Override
  public DynamoDbClient get() {
    return provideDdb(regionProvider.get());
  }

  public static AwsModule_ProvideDdbFactory create(Provider<Region> regionProvider) {
    return new AwsModule_ProvideDdbFactory(regionProvider);
  }

  public static DynamoDbClient provideDdb(Region region) {
    return Preconditions.checkNotNullFromProvides(AwsModule.provideDdb(region));
  }
}
