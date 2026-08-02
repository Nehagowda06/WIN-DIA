import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError } from '../errors/domain-errors';
import { Banner, PageContent } from '../models/domain-models.types';
import { BannerRepository } from '../repositories/banner.repository';
import { PageContentRepository } from '../repositories/page-content.repository';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface CMSService {
  getActiveBanners(): Promise<Result<Banner[], AppError>>;
  getPageContent(slug: string): Promise<Result<PageContent, AppError>>;
}

export class CMSServiceImpl implements CMSService {
  private bannerRepo: BannerRepository;
  private pageContentRepo: PageContentRepository;

  constructor(bannerRepo?: BannerRepository, pageContentRepo?: PageContentRepository) {
    this.bannerRepo = bannerRepo || container.resolve<BannerRepository>(RepositoryTokens.BannerRepository);
    this.pageContentRepo = pageContentRepo || container.resolve<PageContentRepository>(RepositoryTokens.PageContentRepository);
  }

  public async getActiveBanners(): Promise<Result<Banner[], AppError>> {
    return this.bannerRepo.findActive();
  }

  public async getPageContent(slug: string): Promise<Result<PageContent, AppError>> {
    const res = await this.pageContentRepo.findBySlug(slug);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Page content not found for slug "${slug}"`));
    }
    return success(res.value);
  }
}
