function getCookie(b) {
  let c = `; ${document.cookie}`;
  let a = c.split(`; ${b}=`);
  if (2 === a.length) return a.pop().split(";").shift();
}

function sleep(a) {
  return new Promise(b => {
    setTimeout(b, a);
  });
}

function afterUrlGenerator(a) {
  return `https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables={"id":"${ds_user_id}","include_reel":"true","fetch_mutual":"false","first":"24","after":"${a}"}`;
}

function unfollowUserUrlGenerator(a) {
  return `https://www.instagram.com/web/friendships/${a}/unfollow/`;
}

let followedPeople,
  csrftoken = getCookie("csrftoken"),
  ds_user_id = getCookie("ds_user_id"),
  initialURL = `https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables={"id":"${ds_user_id}","include_reel":"true","fetch_mutual":"false","first":"24"}`,
  doNext = true,
  filteredList = [],
  getUnfollowCounter = 0,
  scrollCicle = 0;

async function startScript() {
  for (var c, d, e, b, f, g = Math.floor; doNext; ) {
    let a;
    try {
      a = await fetch(initialURL).then(a => a.json());
    } catch (h) {
      continue;
    }

    followedPeople || (followedPeople = a.data.user.edge_follow.count);
    doNext = a.data.user.edge_follow.page_info.has_next_page;
    initialURL = afterUrlGenerator(
      a.data.user.edge_follow.page_info.end_cursor
    );
    getUnfollowCounter += a.data.user.edge_follow.edges.length;

    a.data.user.edge_follow.edges.forEach(a => {
      a.node.follows_viewer || filteredList.push(a.node);
    });

    console.clear();
    console.log(
      `Progress ${getUnfollowCounter}/${followedPeople} (${parseInt(
        (100 * getUnfollowCounter) / followedPeople
      )}%)`
    );
    console.log("This users don't follow you (Still in progress)");
    filteredList.forEach(a => {
      console.log(a.username);
    });

    await sleep(g(400 * Math.random()) + 1000);

    scrollCicle++;
    if (6 < scrollCicle) {
      scrollCicle = 0;
      console.log("Sleeping 10 secs to prevent getting temp blocked");
      await sleep(10000);
    }
  }

  console.log("Replacing document content...");

  document.documentElement.innerHTML = ""; // Limpiar contenido del documento

  let container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.justifyContent = "center"; // Centrar horizontalmente
  container.style.backgroundColor = "#1F1F23";
  container.style.padding = "20px";
  container.style.marginTop = "-8px"; // Ajuste para ocultar la línea blanca superior
  container.style.width = "100%"; // Ocupar el 100% del ancho de la pantalla
  container.style.boxSizing = "border-box"; // Incluir el tamaño del borde y el relleno en el ancho total

  // Cálculo del ancho de las cards para que sean iguales
  const numCardsPerRow = 3; // Cambiar el número de tarjetas por fila
  const cardMargin = 20;
  const containerWidth = window.innerWidth * 0.9; // Ancho del contenedor (90% del ancho de la pantalla)
  const cardWidth = (containerWidth - (numCardsPerRow - 1) * cardMargin) / numCardsPerRow; // Ajustar el ancho de las tarjetas

  function generateCards() {
    filteredList.forEach(profile => {
      let link = document.createElement("a");
      link.href = `https://www.instagram.com/${profile.username}`;
      link.target = "_blank"; // Propiedad para abrir en una nueva pestaña
      link.style.textDecoration = "none";
      link.style.display = "flex";
      link.style.flexDirection = "column";
      link.style.alignItems = "center";
      link.style.textAlign = "center";
      link.style.width = `${cardWidth}px`; // Ajustar el ancho de las cards
      link.style.padding = "10px";
      link.style.margin = `${cardMargin}px`; // Establecer el margen entre las cards
      link.style.borderRadius = "8px";
      link.style.backgroundColor = "#292929";
      link.style.color = "#FFF";
      link.style.transition = "background-color 0.3s";
      link.style.cursor = "pointer";

      link.addEventListener("mouseenter", () => {
        link.style.backgroundColor = "#3a3a3a";
      });

      link.addEventListener("mouseleave", () => {
        link.style.backgroundColor = "#292929";
      });

      let profileImage = document.createElement("img");
      profileImage.src = profile.profile_pic_url;
      profileImage.alt = `${profile.username}'s profile picture`;
      profileImage.style.width = "100px";
      profileImage.style.height = "100px";
      profileImage.style.borderRadius = "50%";
      profileImage.style.objectFit = "cover";
      profileImage.style.cursor = "pointer";

      let username = document.createElement("span");
      let truncatedUsername =
        profile.username.length > 16
          ? profile.username.substring(0, 13) + "..."
          : profile.username;
      username.textContent = truncatedUsername;
      username.style.marginTop = "10px";
      username.style.fontWeight = "bold";
      username.style.whiteSpace = "nowrap";
      username.style.overflow = "hidden";
      username.style.textOverflow = "ellipsis";

      let unfollowButton = document.createElement("button");
      unfollowButton.textContent = "Unfollow";
      unfollowButton.style.marginTop = "10px";
      unfollowButton.style.padding = "6px 12px";
      unfollowButton.style.borderRadius = "4px";
      unfollowButton.style.backgroundColor = "#e91e63";
      unfollowButton.style.color = "#fff";
      unfollowButton.style.border = "none";
      unfollowButton.style.cursor = "pointer";
      unfollowButton.style.transition = "background-color 0.3s";

      unfollowButton.addEventListener("mouseenter", () => {
        unfollowButton.style.backgroundColor = "#c2185b";
      });

      unfollowButton.addEventListener("mouseleave", () => {
        unfollowButton.style.backgroundColor = "#e91e63";
      });

      unfollowButton.addEventListener("click", async (event) => {
        event.preventDefault(); // Evitar que se abra el enlace

        try {
          const unfollowURL = unfollowUserUrlGenerator(profile.id);
          const response = await fetch(unfollowURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-CSRFToken": csrftoken,
            },
          });

          if (response.ok) {
            console.log(`Unfollowed ${profile.username}`);
            link.remove(); // Eliminar la tarjeta del DOM
          } else {
            console.error(`Failed to unfollow ${profile.username}`);
          }
        } catch (error) {
          console.error(`Error unfollowing ${profile.username}:`, error);
        }
      });

      link.appendChild(profileImage);
      link.appendChild(username);
      link.appendChild(unfollowButton);

      container.appendChild(link);
    });

    document.documentElement.appendChild(container);

    console.log("Document content replaced!");
  }

  generateCards();
}

startScript();