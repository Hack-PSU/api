import { Provider, ReflectiveInjector, ResolvedReflectiveProvider } from 'injection-js';

export class RootInjector {

  public static getInjector(): ReflectiveInjector {
    if (!this.injector) {
      this.injector = ReflectiveInjector.fromResolvedProviders(Array.from(this.providers));
    }
    return this.injector;
  }

  public static registerProvider(providers: Provider[]) {
    ReflectiveInjector.resolve(providers).forEach(provider => this.providers.add(provider));
  }

  private static providers: Set<ResolvedReflectiveProvider> = new Set();

  private static injector: ReflectiveInjector;
}
