import { api } from './api';

export interface SellerSearchResult {
  id: string;
  businessName: string;
  logoUrl?: string;
  profileDescription?: string;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
  city?: string;
  state?: string;
}

export interface CreatorSearchResult {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
  videosCount: number;
  location?: string;
}

export interface SearchSellersResponse {
  sellers: SellerSearchResult[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchCreatorsResponse {
  creators: CreatorSearchResult[];
  total: number;
  page: number;
  totalPages: number;
}

class SearchService {
  async searchSellers(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchSellersResponse> {
    const response = await api.get<SearchSellersResponse>('/sellers/search', {
      params: { q: query, page, limit },
    });
    return response.data;
  }

  async searchCreators(
    query: string,
    page: number = 1,
    limit: number = 20,
    category?: string,
  ): Promise<SearchCreatorsResponse> {
    const response = await api.get<any>('/creators/search', {
      params: { q: query, page, limit, category },
    });
    // Backend returns { creators, pagination: { total, page, ... } }
    const data = response.data;
    return {
      creators: data.creators,
      total: data.pagination?.total ?? data.total ?? 0,
      page: data.pagination?.page ?? data.page ?? 1,
      totalPages: data.pagination?.totalPages ?? data.totalPages ?? 1,
    };
  }
}

export const searchService = new SearchService();
