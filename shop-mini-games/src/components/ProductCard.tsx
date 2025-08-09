import { Component } from "react";
import { ProductCard as ShopifyProductCard } from "@shopify/shop-minis-react";

interface CustomProductCardProps {
  product: any; // You can type this more specifically based on Shopify's product type
  className?: string;
  showDescription?: boolean;
  showVariants?: boolean;
  hidePricing?: boolean;
  customActions?: boolean;
}

interface CustomProductCardState {
  isHovered: boolean;
  imageLoaded: boolean;
  showCustomView: boolean;
}

// Base ProductCard wrapper class that extends Shopify's implementation
class BaseProductCard extends Component<
  CustomProductCardProps,
  CustomProductCardState
> {
  // Default props
  static defaultProps = {
    className: "",
    showDescription: false,
    showVariants: false,
    hidePricing: false,
    customActions: false,
  };

  constructor(props: CustomProductCardProps) {
    super(props);

    // Initialize state
    this.state = {
      isHovered: false,
      imageLoaded: false,
      showCustomView: props.hidePricing || false,
    };
  }

  // Method to toggle between Shopify and custom view
  protected toggleView = (): void => {
    this.setState((prevState) => ({
      showCustomView: !prevState.showCustomView,
    }));
  };

  // Method to render the original Shopify ProductCard
  protected renderShopifyCard(): JSX.Element {
    const { product, className } = this.props;
    return (
      <div className={`shopify-product-card ${className}`}>
        <ShopifyProductCard product={product} />
      </div>
    );
  }

  // Method to apply custom styling to Shopify card
  protected renderEnhancedShopifyCard(): JSX.Element {
    const { product, className } = this.props;
    const { isHovered } = this.state;

    return (
      <div className={`enhanced-shopify-card ${className}`}>
        <div
          className={`border-2 rounded-lg p-2 transition-all duration-200 ${
            isHovered ? "border-blue-400 shadow-lg" : "border-gray-200"
          }`}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        >
          <ShopifyProductCard product={product} />
          {this.renderCustomExtensions()}
        </div>
      </div>
    );
  }

  // Method to render custom extensions to the Shopify card
  protected renderCustomExtensions(): JSX.Element | null {
    const { customActions } = this.props;

    if (!customActions) return null;

    return (
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={this.toggleView}
          className="w-full bg-gray-100 text-gray-700 py-1 px-2 rounded text-xs hover:bg-gray-200 transition-colors"
        >
          Toggle Custom View
        </button>
      </div>
    );
  }

  // Method to get product image
  protected getProductImage(): string | undefined {
    const { product } = this.props;
    return product.images?.[0]?.url || product.featuredImage?.url;
  }

  // Method to handle quick view click
  protected handleQuickView = (): void => {
    console.log("Quick view clicked for product:", this.props.product.title);
    // Add your quick view logic here
  };

  // Method to handle add to cart click
  protected handleAddToCart = (): void => {
    console.log("Add to cart clicked for product:", this.props.product.title);
    // Add your add to cart logic here
  };

  // Method to handle mouse enter
  protected handleMouseEnter = (): void => {
    this.setState({ isHovered: true });
  };

  // Method to handle mouse leave
  protected handleMouseLeave = (): void => {
    this.setState({ isHovered: false });
  };

  // Method to handle image load
  protected handleImageLoad = (): void => {
    this.setState({ imageLoaded: true });
  };

  // Method to render product image (custom view)
  protected renderProductImage(): JSX.Element | null {
    const productImage = this.getProductImage();
    const { product } = this.props;

    if (!productImage) return null;

    return (
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <img
          src={productImage}
          alt={product.title || "Product image"}
          className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-200"
          onLoad={this.handleImageLoad}
        />
      </div>
    );
  }

  // Method to render product title and vendor (custom view)
  protected renderProductTitle(): JSX.Element {
    const { product } = this.props;

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {product.title}
        </h3>
        {product.vendor && (
          <p className="text-sm text-gray-500 mt-1">by {product.vendor}</p>
        )}
      </div>
    );
  }

  // Method to render product type badge (custom view)
  protected renderProductType(): JSX.Element | null {
    const { product } = this.props;

    if (!product.productType) return null;

    return (
      <div className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
        {product.productType}
      </div>
    );
  }

  // Method to render description section (extension)
  protected renderDescription(): JSX.Element | null {
    const { product, showDescription } = this.props;

    if (!showDescription || !product.description) return null;

    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-600 line-clamp-2">
          {product.description}
        </p>
      </div>
    );
  }

  // Method to render variants info (extension)
  protected renderVariantsInfo(): JSX.Element | null {
    const { product, showVariants } = this.props;

    if (!showVariants || !product.variants || product.variants.length <= 1)
      return null;

    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {product.variants.length} variants available
        </p>
      </div>
    );
  }

  // Method to render action buttons (custom view)
  protected renderActionButtons(): JSX.Element {
    return (
      <div className="mt-3 flex gap-2">
        <button
          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600 transition-colors"
          onClick={this.handleQuickView}
        >
          Quick View
        </button>
        <button
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300 transition-colors"
          onClick={this.handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    );
  }

  // Method to render custom view (without pricing)
  protected renderCustomView(): JSX.Element {
    const { className } = this.props;
    const { isHovered } = this.state;

    return (
      <div className={`custom-product-card ${className}`}>
        <div
          className={`border-2 rounded-lg p-4 transition-all duration-200 ${
            isHovered ? "border-blue-400 shadow-lg" : "border-gray-200"
          }`}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        >
          {/* Custom Product Display WITHOUT Price */}
          <div className="space-y-3">
            {this.renderProductImage()}
            {this.renderProductTitle()}
            {this.renderProductType()}
          </div>

          {this.renderDescription()}
          {this.renderVariantsInfo()}
          {this.renderActionButtons()}
        </div>
      </div>
    );
  }

  // Main render method - decides which view to show
  render(): JSX.Element {
    const { hidePricing } = this.props;
    const { showCustomView } = this.state;

    // Show custom view if hidePricing is true or user toggled to custom view
    if (hidePricing || showCustomView) {
      return this.renderCustomView();
    }

    // Show enhanced Shopify card by default
    return this.renderEnhancedShopifyCard();
  }
}

// Extended ProductCard class that adds more functionality
export default class ProductCard extends BaseProductCard {
  constructor(props: CustomProductCardProps) {
    super(props);
  }

  // Override method to add custom quick view functionality
  protected handleQuickView = (): void => {
    super.handleQuickView();
    // Add extended quick view logic
    console.log("Extended quick view with product details:", {
      id: this.props.product.id,
      title: this.props.product.title,
      vendor: this.props.product.vendor,
      type: this.props.product.productType,
    });
  };

  // Override method to add custom add to cart functionality
  protected handleAddToCart = (): void => {
    super.handleAddToCart();
    // Add extended add to cart logic
    console.log("Extended add to cart with analytics:", {
      productId: this.props.product.id,
      timestamp: new Date().toISOString(),
      source: "custom-product-card",
    });
  };

  // Additional method specific to extended class
  private handleProductAnalytics = (): void => {
    console.log("Product viewed:", {
      product: this.props.product.title,
      timestamp: new Date().toISOString(),
      viewType: this.state.showCustomView ? "custom" : "shopify",
    });
  };

  // Override render to add analytics
  render(): JSX.Element {
    // Track product view
    this.handleProductAnalytics();

    // Call parent render method
    return super.render();
  }
}
