
export interface PriceOffer {
  store: string;
  product: string;
  price: string;
  validUntil?: string;
  description?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  text: string;
  sources: GroundingSource[];
  offers: PriceOffer[];
}
