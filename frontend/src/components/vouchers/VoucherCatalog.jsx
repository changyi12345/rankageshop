import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchVoucherCategories, fetchVoucherProducts } from "../../api/vouchers";
import { VOUCHERS_PATH } from "../../config/siteNav";
import { sanitizeUserMessage } from "../../utils/userMessages";
import Select from "../ui/Select";
import VoucherCategoryCard from "./VoucherCategoryCard";
import VoucherProductCard from "./VoucherProductCard";

const CATEGORY_PAGE_SIZE = 12;

export default function VoucherCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);

  const activeCategoryId =
    categoryParam && categoryParam !== "all" ? Number(categoryParam) : null;

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? null,
    [categories, activeCategoryId]
  );

  const isBrowsingProducts = Boolean(activeCategoryId || query.trim());

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await fetchVoucherCategories();
      setCategories(cats);

      if (!query.trim() && !activeCategoryId) {
        setProducts([]);
      } else {
        const productCategoryId = query.trim() ? null : activeCategoryId;
        const prods = await fetchVoucherProducts(productCategoryId);
        setProducts(prods);
      }
    } catch (err) {
      setError(
        sanitizeUserMessage(err.message, {
          fallback: "Voucher shop is not available right now.",
        })
      );
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [activeCategoryId, query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCategoryPage(1);
  }, [query, activeCategoryId]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.category_title || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [categories, query]);

  const visibleCategories = useMemo(() => {
    const list = filteredCategories;
    return list.slice(0, categoryPage * CATEGORY_PAGE_SIZE);
  }, [filteredCategories, categoryPage]);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...categories.map((c) => ({ value: String(c.id), label: c.title })),
    ],
    [categories]
  );

  const setCategory = (value) => {
    if (!value || value === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const clearFilters = () => {
    setQuery("");
    searchParams.delete("category");
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="site-container">
        <div
          className="animate-slide-up opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-light">
            Digital vouchers
          </p>
          <h1 className="section-heading mt-2">Voucher shop</h1>
          <p className="section-sub mt-2">
            Gift cards and digital codes — pick a category or search by name.
          </p>
        </div>

        <div
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center animate-slide-up opacity-0"
          style={{ animationDelay: "60ms", animationFillMode: "forwards" }}
        >
          <input
            type="search"
            className="input-field flex-1"
            placeholder="Search vouchers or categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search vouchers"
            disabled={loading}
          />
          {categories.length > 0 ? (
            <Select
              value={activeCategoryId ? String(activeCategoryId) : "all"}
              onValueChange={setCategory}
              options={categoryOptions}
              placeholder="Category"
              disabled={loading}
              size="compact"
              className="w-full sm:w-[min(100%,280px)]"
              aria-label="Filter by category"
            />
          ) : null}
        </div>

        {!loading && activeCategory ? (
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <Link to={VOUCHERS_PATH} className="text-slate-500 transition hover:text-accent-light">
              Vouchers
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-medium text-white">{activeCategory.title}</span>
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs font-semibold text-accent-light transition hover:text-white"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="glass-panel mt-10 border-white/20 px-6 py-10 text-center">
            <p className="text-lg font-medium text-white">Voucher shop unavailable</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <button type="button" className="btn-primary mt-6" onClick={reload}>
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="h-[4.5rem] rounded-2xl skeleton-shimmer" aria-hidden />
            ))}
          </ul>
        ) : null}

        {!loading && !error && !isBrowsingProducts ? (
          <>
            <div className="mt-10 flex items-end justify-between gap-4">
              <h2 className="text-lg font-bold text-white">Categories</h2>
              <p className="text-xs text-slate-500">{filteredCategories.length} total</p>
            </div>
            {visibleCategories.length === 0 ? (
              <div className="glass-panel mt-6 px-6 py-12 text-center">
                <p className="text-white">No categories match your search.</p>
                <button type="button" className="btn-secondary mt-4" onClick={clearFilters}>
                  Clear search
                </button>
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCategories.map((cat, i) => (
                  <li
                    key={cat.id}
                    className="animate-fade-in opacity-0"
                    style={{
                      animationDelay: `${Math.min(i * 35, 250)}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <VoucherCategoryCard category={cat} />
                  </li>
                ))}
              </ul>
            )}
            {visibleCategories.length < filteredCategories.length ? (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCategoryPage((p) => p + 1)}
                >
                  Show more categories
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {!loading && !error && isBrowsingProducts ? (
          <>
            <div className="mt-10 flex items-end justify-between gap-4">
              <h2 className="text-lg font-bold text-white">
                {query.trim()
                  ? "Search results"
                  : activeCategory
                    ? activeCategory.title
                    : "All vouchers"}
              </h2>
              <p className="text-xs text-slate-500">
                {filteredProducts.length} voucher{filteredProducts.length === 1 ? "" : "s"}
              </p>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="glass-panel mt-6 px-6 py-14 text-center">
                <p className="text-lg font-medium text-white">No vouchers found</p>
                <p className="mt-2 text-sm text-slate-400">
                  Try another category or clear your search.
                </p>
                <button type="button" className="btn-secondary mt-4" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="package-catalog__list mt-6">
                {filteredProducts.map((product, i) => (
                  <li
                    key={product.id}
                    className="package-catalog__item animate-fade-in opacity-0"
                    style={{
                      animationDelay: `${Math.min(i * 35, 280)}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <VoucherProductCard product={product} />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
