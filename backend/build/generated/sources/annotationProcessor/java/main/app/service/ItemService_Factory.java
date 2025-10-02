package app.service;

import app.repo.UserItemRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class ItemService_Factory implements Factory<ItemService> {
  private final Provider<UserItemRepository> repoProvider;

  public ItemService_Factory(Provider<UserItemRepository> repoProvider) {
    this.repoProvider = repoProvider;
  }

  @Override
  public ItemService get() {
    return newInstance(repoProvider.get());
  }

  public static ItemService_Factory create(Provider<UserItemRepository> repoProvider) {
    return new ItemService_Factory(repoProvider);
  }

  public static ItemService newInstance(UserItemRepository repo) {
    return new ItemService(repo);
  }
}
