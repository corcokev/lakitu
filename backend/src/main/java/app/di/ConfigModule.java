package app.di;

import dagger.Module;
import dagger.Provides;
import javax.inject.Named;
import javax.inject.Singleton;

@Module
public class ConfigModule {
  @Provides @Singleton @Named("TABLE_NAME")
  static String tableName() { return System.getenv("TABLE_NAME"); }
}