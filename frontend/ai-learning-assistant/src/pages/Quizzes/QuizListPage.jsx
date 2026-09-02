import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import quizService from "../../services/QuizService";
import moment from 'moment';
import Spinner from '../../components/common/Spinner';

const QuizListPage = () => {
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState([]);
    const navigate = useNavigate();
    
    return (<div>QuizListPage</div>)
}

export default QuizListPage;