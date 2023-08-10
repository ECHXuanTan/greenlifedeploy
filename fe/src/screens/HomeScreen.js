import { useEffect, useReducer } from 'react';
import axios from 'axios';
import logger from 'use-reducer-logger';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Product from '../components/Product';
import { Helmet } from 'react-helmet-async';
import MessageBox from '../components/MessageBox';
import LoadingBox from '../components/LoadingBox';
// import data from '../data';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, products: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function HomeScreen() {
  const [{ loading, error, products }, dispatch] = useReducer(logger(reducer), {
    products: [],
    loading: true,
    error: '',
  });
  // const [products, setProducts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get('https://greenlife-deploy-5.onrender.com/api/products');
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: err.message });
      }

      // setProducts(result.data);
    };
    fetchData();

    const scriptElement1 = document.createElement('script');
    scriptElement1.id = 'mcjs';
    scriptElement1.innerHTML = `
      !function(c,h,i,m,p){m=c.createElement(h),p=c.getElementsByTagName(h)[0],m.async=1,m.src=i,p.parentNode.insertBefore(m,p)}
      (document,"script","https://chimpstatic.com/mcjs-connected/js/users/cc9f7cece067e1eda3e65c17f/cdf531ae830e57a1acda0cd8a.js");
    `;
    document.head.appendChild(scriptElement1);

    // Attach event listeners and functions for the popup form
    const showPopup = () => {
      const popup = document.getElementById("subscribePopup");
      popup.style.display = "block";
    };

    const hidePopup = () => {
      const popup = document.getElementById("subscribePopup");
      popup.style.display = "none";
    };

    const subscribeBtn = document.getElementById("subscribeBtn");
    subscribeBtn.addEventListener("click", showPopup);

    window.addEventListener("click", function(event) {
      const popup = document.getElementById("subscribePopup");
      if (event.target === popup) {
        hidePopup();
      }
    });

    return () => {
      // Cleanup: remove the first <script> tag and event listeners when the component is unmounted
      document.head.removeChild(scriptElement1);
      subscribeBtn.removeEventListener("click", showPopup);
      window.removeEventListener("click", hidePopup);
    };

  }, []);
  return (
    <div>
      <Helmet>
        <title>GreenLife</title>
      </Helmet>
      <h1>Sản phẩm mới</h1>
      <div className="products">
        {loading ? (
           <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <Row>
            {products.map((product) => (
              <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                <Product product={product}></Product>
              </Col>
            ))}
          </Row>
        )}
      </div>
    {/* Provided Mailchimp form */}
    <div id="mc_embed_shell">
        <link href="//cdn-images.mailchimp.com/embedcode/classic-061523.css" rel="stylesheet" type="text/css" />
        
        <div id="mc_embed_signup">
          {/* The rest of the provided Mailchimp form HTML */}
        </div>
      </div>

      {/* Subscribe button to trigger the popup */}
      <button id="subscribeBtn">Subscribe</button>

      {/* Popup form */}
      <div id="subscribePopup" style={{ display: "none" }}>
        {/* Additional JavaScript and event listeners for the popup */}
      </div>
    </div>
  );
}
export default HomeScreen;
