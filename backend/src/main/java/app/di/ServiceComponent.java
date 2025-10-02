package app.di;

import app.handlers.RouterHandler;
import app.repo.UserItemRepository;
import app.service.ItemService;
import dagger.Component;
import javax.inject.Singleton;

@Singleton
@Component(modules = {AwsModule.class, ConfigModule.class, RepoModule.class})
public interface ServiceComponent {
  ItemService itemService();
  UserItemRepository userItemRepository();
  void inject(RouterHandler handler);
}