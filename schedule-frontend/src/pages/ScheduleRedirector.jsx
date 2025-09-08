import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWeekNumber } from '../utils/dateUtils';

function ScheduleRedirector() {
    const { facultyId, groupId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (facultyId && groupId) {
            const currentWeek = getWeekNumber(new Date());
            navigate(`/schedule/${facultyId}/${groupId}/${currentWeek}`, { replace: true });
        }
    }, [facultyId, groupId, navigate]);

    return null; 
}

export default ScheduleRedirector;