import './App.css';
import { useForm } from "react-hook-form";

function App() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  return (
    <form>
      <div>
        <label>Full Name: </label>
      </div>
      <div>
        <label>Full Name: </label>
      </div>
    </form>
  )
}

export default App
