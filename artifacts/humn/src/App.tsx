import Header from './chrome/Header';
import Cursor from './chrome/Cursor';
import AwakeningFilm from './film/AwakeningFilm';
import Film from './film/Film';
import AfterFilm from './sections/AfterFilm';
import Footer from './sections/Footer';

export default function App() {
  return (
    <div id="top">
      <a className="skip-link" href="#manifesto">Skip cinematic intro</a>
      <Cursor />
      <Header />
      <main>
        <AwakeningFilm />
        <Film />
        <AfterFilm />
      </main>
      <Footer />
    </div>
  );
}
