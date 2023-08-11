import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import Rating from './Rating';
import axios from 'axios';
import { useContext } from 'react';
import { Store } from '../store';
import ReactGA from 'react-ga4';

function Product(props) {
  const { product } = props;

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;

  const addToCartHandler = async (item) => {
    ReactGA.event({
      category: "Button",
      aaction: "add_to_cart",
      label: "click", // optional
    });
    const existItem = cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`https://greenlife-deploy-5.onrender.com/api/products/${item._id}`);
    
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity },
    });
  };


  return (
    <Card>
      <Link to={`/product/${product.slug}`}>
        <img src={product.image} className="card-img-top" alt={product.name} />
      </Link>
      <Card.Body>
        <Link to={`/product/${product.slug}`}>
          <Card.Title>{product.name}</Card.Title>
        </Link>
        <Rating rating={product.rating} numReviews={product.numReviews} />
        <Card.Text>{product.price}đ</Card.Text>
        {product.countInStock === 0 ? (
          <Button variant="light" disabled>
            Hết hàng
          </Button>
        ) : (
          <Button id ="addToCartHandler" onClick={() => addToCartHandler(product)}>Thêm vào giỏ hàng</Button>
        )}
      </Card.Body>
    </Card>
  );
}
export default Product;
