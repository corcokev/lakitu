package app.di;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import software.amazon.awssdk.regions.Region;

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
public final class AwsModule_ProvideRegionFactory implements Factory<Region> {
  @Override
  public Region get() {
    return provideRegion();
  }

  public static AwsModule_ProvideRegionFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static Region provideRegion() {
    return Preconditions.checkNotNullFromProvides(AwsModule.provideRegion());
  }

  private static final class InstanceHolder {
    private static final AwsModule_ProvideRegionFactory INSTANCE = new AwsModule_ProvideRegionFactory();
  }
}
