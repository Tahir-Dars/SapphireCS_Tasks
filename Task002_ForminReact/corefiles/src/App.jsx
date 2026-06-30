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
          className={errors.firstName ? "erroratinput" : ""}
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
        {errors.firstName && <p className="errormsg">{errors.firstName.message}</p>}
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
      <div>
        <label>Age: </label>
        <input
          className={errors.age ? "erroratinput" : ""}
          {...register("age", {
            required: "This field is required",
            min: {
              value: 18,
              message: "Age should be at least 18",
            },
            max: {
              value: 60,
              message: "Age should be at most 60",
            },
          })}
        />
        {errors.age && <p className="errormsg">{errors.age.message}</p>}
      </div>
      <div>
        <label>Email: </label>
        <input
          className={errors.email ? "erroratinput" : ""}
          {...register("email", {
            required: "This field is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Invalid email address",
            },
          })}
        />
        {errors.email && <p className="errormsg">{errors.email.message}</p>}
      </div>
      <div>
        <label>Phone: </label>
        <input
          className={errors.phone ? "erroratinput" : ""}
          {...register("phone", {
            required: "This field is required",
            pattern: {
              value: /^\d{11}$/,
              message: "Phone number should be 11 digits, No spaces or special characters allowed",
            },
          })}
        />
        {errors.phone && <p className="errormsg">{errors.phone.message}</p>}
      </div>
      <div>
        <label>Gender: </label>

        <select
          className={errors.gender ? "erroratinput" : ""}
          {...register("gender", {
            required: "Please select a gender",
          })}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="dont_wish_to_express">Don't wish to express</option>
        </select>
        {errors.gender && <p className="errormsg">{errors.gender.message}</p>}
      </div>
      <div>
        <label>CNIC: </label>
        <textarea
          className={errors.cnic ? "erroratinput" : ""}
          {...register("cnic", {
            required: "This field is required",
            minLength: {
              value: 13,
              message: "CNIC should be 13 digits",
            },
            maxLength: {
              value: 13,
              message: "CNIC should be 13 digits",
            },
          })}
        />
        {errors.cnic && <p className="errormsg">{errors.cnic.message}</p>}
      </div>
      <div>
        <label>Date of Birth: </label>
        <input
          type="date"
          className={errors.dateOfBirth ? "erroratinput" : ""}
          {...register("dateOfBirth", {
            required: "This field is required",
          })}
        />
        {errors.dateOfBirth && <p className="errormsg">{errors.dateOfBirth.message}</p>}
      </div>
      <input type="submit" value="Submit" />
    </form>

  )
}

export default App
