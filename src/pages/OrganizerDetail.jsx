import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const OrganizerDetail = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        const res = await api.get(`/participants/organizers/${id}`);
        setData(res.data);
    };

    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <h2>{data.Organizer.organizerName}</h2>
            <p>{data.Organizer.category}</p>
            <p>{data.Organizer.description}</p>
            <p>Email: {data.Organizer.contactEmail}</p>

            <h3>Upcoming Events</h3>
            {data.Upcoming.map((event) => (
                <div key={event._id}>
                    <p>{event.eventName}</p>
                </div>
            ))}

            <h3>Past Events</h3>
            {data.Past.map((event) => (
                <div key={event._id}>
                    <p>{event.eventName}</p>
                </div>
            ))}
        </div>
    );
};

export default OrganizerDetail;