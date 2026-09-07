import Image from "next/image";
import {
  BagButton,
  AddToBag,
  ArticleButton,
  ConsentLinks,
  InspectorButton,
} from "./ShopControls";

// Server Component: static storefront content stays outside the client bundle.
export default function Storefront() {
  return (
    <div id="storefront">
      <div className="announcement">
        A little space for something good.{" "}
        <span>Meet your next favourite notebook.</span>
      </div>
      <header className="site-header">
        <a className="wordmark" href="#storefront" aria-label="Fieldnotes home">
          fieldnotes<span>®</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#collection">The notebook</a>
          <a href="#story">Our approach</a>
          <a href="#journal">The journal</a>
        </nav>
        <BagButton />
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">GOOD THINGS BEGIN ON PAPER</p>
            <h1>
              A place for
              <br />
              your <em>next idea.</em>
            </h1>
            <p>
              For the plans, the passing thoughts, and the things you don’t want
              to forget. Make a little room for them.
            </p>
            <a className="button dark" href="#collection">
              Find your everyday notebook <span>↗</span>
            </a>
            <div className="hero-footnote">
              <span>01 / THE EVERYDAY COLLECTION</span>
              <span>Made for the way you think.</span>
            </div>
          </div>
          <figure className="hero-image">
            <Image
              src="/images/studio-notebooks.png"
              alt="Cloth notebooks in sage, terracotta and forest green beside an open notebook and pencil in afternoon sunlight"
              width={1536}
              height={1024}
              preload
              sizes="(max-width: 799px) 100vw, 50vw"
            />
            <figcaption>PAPER. POSSIBILITIES. EVERY DAY.</figcaption>
          </figure>
        </section>
        <div className="values-strip">
          <span>A quieter kind of everyday essential</span>
          <span>Thoughtfully simple</span>
          <span>Room to make a mess</span>
          <span>Yours to fill</span>
        </div>
        <section className="collection section" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR DAILY COMPANION</p>
              <h2>Meet the Everyday.</h2>
            </div>
            <p>
              Good paper. A satisfying cover.
              <br />
              Nothing between you and your ideas.
            </p>
          </div>
          <div className="product-feature">
            <div className="product-stage">
              <span className="small-label">THE ORIGINAL / SAGE</span>
              <div
                className="notebook"
                role="img"
                aria-label="Sage Everyday Notebook with an understated Fieldnotes cover"
              >
                <div className="spine"></div>
                <div className="book-title">
                  fieldnotes<span>EVERYDAY NOTEBOOK</span>
                </div>
                <div className="book-bottom">
                  A LITTLE ROOM
                  <br />
                  FOR SOMETHING GOOD.<span>No. 01</span>
                </div>
              </div>
              <div className="product-shadow"></div>
              <span className="stage-caption">
                A blank page is a good place to start.
              </span>
            </div>
            <div className="product-information">
              <p className="eyebrow">THE EVERYDAY NOTEBOOK</p>
              <div className="product-title">
                <h3>
                  Small book.
                  <br />
                  Big possibilities.
                </h3>
                <span>£18</span>
              </div>
              <p>
                Your morning pages, your next project, your list for the
                weekend. One simple notebook to keep it all together.
              </p>
              <div className="colour">
                <span className="swatch"></span> Sage{" "}
                <span className="colour-note">Our original colour</span>
              </div>
              <AddToBag />
              <details open>
                <summary>
                  The details <span>+</span>
                </summary>
                <p>
                  A tactile cover, a clean, unruled interior and a compact
                  everyday format. Space for your lists, sketches and small
                  discoveries.
                </p>
              </details>
              <details>
                <summary>
                  A note about this store <span>+</span>
                </summary>
                <p>
                  Fieldnotes is a demonstration shop. You can explore the basket
                  and place a sample order; no payment or personal details are
                  collected, and no physical product is shipped.
                </p>
              </details>
            </div>
          </div>
        </section>
        <section className="story" id="story">
          <div className="story-art">
            <span className="eyebrow">A NOTE FROM FIELDNOTES</span>
            <div className="paper-note">
              <span>Things to make room for:</span>
              <p>
                A thought.
                <br />A small plan.
                <br />A fresh start.
              </p>
              <span className="handwritten">and whatever comes next.</span>
            </div>
            <span className="pencil" aria-hidden="true"></span>
          </div>
          <div className="story-copy">
            <p className="eyebrow">LESS NOISE. MORE POSSIBILITY.</p>
            <h2>
              Some things are
              <br />
              better <em>on paper.</em>
            </h2>
            <p>
              Not every idea needs a notification. Sometimes it just needs a
              blank page and a moment of your attention.
            </p>
            <p>
              Fieldnotes is an exercise in keeping things simple: familiar
              objects, considered colours, and enough room to make them your
              own.
            </p>
            <a className="text-link" href="#collection">
              Make a little space ↗
            </a>
          </div>
        </section>
        <section className="journal section" id="journal">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FROM THE JOURNAL</p>
              <h2>Notes on a slower day.</h2>
            </div>
            <span className="journal-index">
              THOUGHTS, RITUALS & SMALL BEGINNINGS
            </span>
          </div>
          <div className="journal-grid">
            <ArticleButton className="journal-card" article="morning">
              <div className="journal-art morning">
                <div className="drawn-page">
                  <span>today,</span>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                <div className="coffee"></div>
              </div>
              <span className="eyebrow">01 / EVERYDAY RITUALS</span>
              <h3>
                Five minutes, a blank page,
                <br />
                and a fresh start. <span>↗</span>
              </h3>
            </ArticleButton>
            <ArticleButton className="journal-card" article="ideas">
              <div className="journal-art ideas">
                <div className="idea-paper">
                  What if
                  <br />
                  <em>
                    you just
                    <br />
                    began?
                  </em>
                </div>
                <span className="circle-mark"></span>
              </div>
              <span className="eyebrow">02 / MAKING SPACE</span>
              <h3>
                You don’t need a perfect idea.
                <br />
                Just a place to put it. <span>↗</span>
              </h3>
            </ArticleButton>
          </div>
        </section>
        <section className="closing">
          <p className="eyebrow">START SOMETHING SMALL.</p>
          <h2>
            The rest is
            <br />
            <em>up to you.</em>
          </h2>
          <a className="button light" href="#collection">
            Pick up a notebook <span>↗</span>
          </a>
        </section>
      </main>
      <footer>
        <div className="footer-top">
          <div>
            <a className="wordmark" href="#storefront">
              fieldnotes<span>®</span>
            </a>
            <p>
              Everyday objects.
              <br />
              Extraordinary possibilities.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <a href="#collection">The notebook</a>
            <a href="#story">Our approach</a>
            <a href="#journal">The journal</a>
          </div>
          <div>
            <h3>The small print</h3>
            <ConsentLinks />
            <ArticleButton id="about-demo" article="about">
              About this shop
            </ArticleButton>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Fieldnotes Studio</span>
          <span>A sample storefront by PAPAFAM. No real purchases.</span>
          <InspectorButton />
        </div>
      </footer>
    </div>
  );
}
