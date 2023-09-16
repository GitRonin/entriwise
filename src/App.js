// Styles
import './App.css';

// Components
import { Block, Button, Logo } from './components'

function App() {
  return (
    <div className="App">
      <Logo />
      <div className='blocks'>
        <Block><Button /></Block>
        <Block />
      </div>
      <div className='blocks'>
        <Block />
        <Block />
      </div>
    </div>
  );
}

export default App;
