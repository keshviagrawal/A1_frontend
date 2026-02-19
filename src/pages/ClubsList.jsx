import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ClubsList = () => {
    const [organizers, setOrganizers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        const res = await api.get("/participants/organizers");
        setOrganizers(res.data);
    };

    const handleFollow = async (id) => {
        await api.post(`/participants/organizers/${id}/follow`);
        fetchOrganizers();
    };

    const handleUnfollow = async (id) => {
        await api.delete(`/participants/organizers/${id}/follow`);
        fetchOrganizers();
    };

    return (
        <div>
            <h2>Clubs / Organizers</h2>

            {organizers.map((org) => (
                <div key={org._id} style={{ border: "1px solid gray", padding: "10px", margin: "10px" }}>
                    <h3 onClick={() => navigate(`/organizer/${org._id}`)}>
                        {org.organizerName}
                    </h3>

                    <p>{org.category}</p>
                    <p>{org.description}</p>

                    {org.isFollowed ? (
                        <button onClick={() => handleUnfollow(org._id)}>
                            Unfollow
                        </button>
                    ) : (
                        <button onClick={() => handleFollow(org._id)}>
                            Follow
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ClubsList;