package app.di;

import app.handlers.RouterHandler;
import app.repo.UserItemRepository;
import app.service.ItemService;
import dagger.internal.DaggerGenerated;
import dagger.internal.DoubleCheck;
import dagger.internal.Provider;
import javax.annotation.processing.Generated;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

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
public final class DaggerServiceComponent {
  private DaggerServiceComponent() {
  }

  public static Builder builder() {
    return new Builder();
  }

  public static ServiceComponent create() {
    return new Builder().build();
  }

  public static final class Builder {
    private Builder() {
    }

    public ServiceComponent build() {
      return new ServiceComponentImpl();
    }
  }

  private static final class ServiceComponentImpl implements ServiceComponent {
    private final ServiceComponentImpl serviceComponentImpl = this;

    private Provider<Region> provideRegionProvider;

    private Provider<DynamoDbClient> provideDdbProvider;

    private Provider<DynamoDbEnhancedClient> enhancedProvider;

    private Provider<String> tableNameProvider;

    private Provider<UserItemRepository> userRepoProvider;

    private ServiceComponentImpl() {

      initialize();

    }

    @SuppressWarnings("unchecked")
    private void initialize() {
      this.provideRegionProvider = DoubleCheck.provider(AwsModule_ProvideRegionFactory.create());
      this.provideDdbProvider = DoubleCheck.provider(AwsModule_ProvideDdbFactory.create(provideRegionProvider));
      this.enhancedProvider = DoubleCheck.provider(RepoModule_EnhancedFactory.create(provideDdbProvider));
      this.tableNameProvider = DoubleCheck.provider(ConfigModule_TableNameFactory.create());
      this.userRepoProvider = DoubleCheck.provider(RepoModule_UserRepoFactory.create(enhancedProvider, tableNameProvider));
    }

    @Override
    public ItemService itemService() {
      return new ItemService(userRepoProvider.get());
    }

    @Override
    public UserItemRepository userItemRepository() {
      return userRepoProvider.get();
    }

    @Override
    public void inject(RouterHandler handler) {
    }
  }
}
