package app.di;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

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
public final class ConfigModule_TableNameFactory implements Factory<String> {
  @Override
  public String get() {
    return tableName();
  }

  public static ConfigModule_TableNameFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static String tableName() {
    return Preconditions.checkNotNullFromProvides(ConfigModule.tableName());
  }

  private static final class InstanceHolder {
    private static final ConfigModule_TableNameFactory INSTANCE = new ConfigModule_TableNameFactory();
  }
}
