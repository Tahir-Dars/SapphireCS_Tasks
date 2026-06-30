import './App.css';
import { useForm } from "react-hook-form";



function App() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  function onSubmit(data) {
    console.log("Submitting the form", data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Full Name: </label>
        <input
          {...register("firstName", {
            required: "This field is required",
            minLength: {
              value: 3,
              message: "Name should be at least 3 characters",
            },
            maxLength: {
              value: 30,
              message: "Name should be at most 30 characters",
            },
          })}
        />
        {errors.firstName && <p>{errors.firstName.message}</p>}
      </div>
      <div>
        <label>Father Name: </label>
        <input
          className={errors.fatherName ? "erroratinput" : ""}
          {...register("fatherName", {
            required: "This field is required",
            minLength: {
              value: 3,
              message: "Name should be at least 3 characters",
            },
            maxLength: {
              value: 30,
              message: "Name should be at most 30 characters",
            },
          })}
        />
        {errors.fatherName && <p className="errormsg">{errors.fatherName.message}</p>}
      </div>

      <input type="submit" value="Submit" />
    </form>
  )
}

export default App
